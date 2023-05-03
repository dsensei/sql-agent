import { type DataSource } from '../datasource/datasource';
import type DataSourceContextIndex from './types';

export default class DummyIndex implements DataSourceContextIndex {
  private readonly store: string[] = [];

  constructor(source: DataSource) {
    void source.getInitializationPromise().then(async () => {
      const tableSchemas = source.getTables();

      this.store.push(...tableSchemas.map(schema => schema.getUniqueID()));
    });
  }

  async search(_: string): Promise<string[]> {
    return this.store;
  }
}
