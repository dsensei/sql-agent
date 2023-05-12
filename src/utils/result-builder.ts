export interface Column {
  width: number
  title: string
  dataIndex: string
  prefix?: string
  suffix?: string
}

export type Row = Record<string, string | number>;

export class Result {
  constructor(
    public readonly slackTableContent: string,
    public readonly numRowsTruncated: number,
    public readonly fullCsvContent: string

  ) { }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public toSlackMessageDisplayResult() {
    return {
      slackTableContent: this.slackTableContent,
      numRowsTruncated: this.numRowsTruncated
    };
  }
}

const MAX_OUTPUT_LENGTH = 2600;

function padLeft(text: string, maxLength = 13): string {
  return (text.length < maxLength ? new Array(maxLength - text.length).fill(' ').join('') + text : text);
}

function padRight(text: string, maxLength = 13): string {
  return (text.length < maxLength ? text + new Array(maxLength - text.length).fill(' ').join('') : text);
}

function fillDash(length: number): string {
  return new Array(length).fill('-').join('')
};

function getLines(columns: Column[]): string {
  return fillDash(columns.reduce((sum, col) => (col.width ?? 10) + sum, 0) + 2 * (columns.length - 1));
}

function getCol(column: Column, row: Row): string {
  const { width = 10, dataIndex, prefix = '', suffix = '' } = column;
  return padLeft(`${prefix}${row[dataIndex]}${suffix}`, width);
};

function getRow(columns: Column[], row: Row): string {
  return columns.map((column) => getCol(column, row)).join('  ');
};

function getHeaderCol(column: Column): string {
  const { width = 10, title } = column;
  return padRight(title, width);
};

function getHeaderRow(columns: Column[]): string {
  return columns.map((column) => getHeaderCol(column)).join('  ');
};

function buildCSVContent(columns: Column[], rows: Row[]): string {
  const header = columns.map(column => column.title).join(',');
  const content = rows.map(row =>
    Object.values(row).map(value => `${value}`).join(',')
  );

  return [header, ...content].join('\n');
}

function buildFromRows(rows: Row[]): Result {
  if (rows.length === 0) {
    return new Result('', 0, '');
  }

  const columnNames = Object.keys(rows[0]);
  const columnToWidth = rows.map(row => {
    const result: Record<string, number> = {};
    for (const column in row) {
      const value = row[column];
      result[column] = `${value}`.length;
    }
    return result;
  }).reduce(
    (columnToLength1, columnToLength2) => {
      const result: Record<string, number> = {};
      for (const column in columnToLength1) {
        result[column] = columnToLength1[column] >= columnToLength2[column] ? columnToLength1[column] : columnToLength2[column];
      }
      return result;
    }
  )

  return build(
    columnNames.map(
      columnName => ({
        width: Math.max(columnToWidth[columnName], columnName.length),
        title: columnName,
        dataIndex: columnName
      })
    ),
    rows
  );
}

function build(columns: Column[], rows: Row[]): Result {
  const result = [
    getHeaderRow(columns),
    getLines(columns)
  ];

  let totalLength = result.join('\n').length;

  let numIncludedRows = 0;
  for (; numIncludedRows < rows.length; ++numIncludedRows) {
    const rowContent = getRow(columns, rows[numIncludedRows]);
    if (totalLength + rowContent.length > MAX_OUTPUT_LENGTH) {
      break;
    }

    totalLength += rowContent.length + 1;
    result.push(rowContent);
  }

  return new Result(result.join('\n'), rows.length - numIncludedRows, buildCSVContent(columns, rows));
};

const ResultBuilder = {
  buildFromRows,
  build
};

export default ResultBuilder;
