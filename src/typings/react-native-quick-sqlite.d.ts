declare module 'react-native-quick-sqlite' {
  export interface QuickSQLiteResultSet {
    rows?: {
      length: number;
      item: (index: number) => any;
    };
  }

  export interface QuickSQLiteConnection {
    execute: (sql: string, params?: any[]) => QuickSQLiteResultSet;
  }

  export function open(options: { name: string; location?: 'default' | string }): QuickSQLiteConnection;
}
