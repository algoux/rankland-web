import srkPkg from '@algoux/standard-ranklist/package.json';
import srkSchema from '@algoux/standard-ranklist/schema.json';

export type PlaygroundMonacoTheme = 'vs-light' | 'vs-dark';

export type PlaygroundJsonDiagnosticsOptions = {
  validate: boolean;
  allowComments: boolean;
  schemas: Array<{
    uri: string;
    fileMatch: string[];
    schema: unknown;
  }>;
};

export function getPlaygroundJsonDiagnosticsOptions(): PlaygroundJsonDiagnosticsOptions {
  return {
    validate: true,
    allowComments: false,
    schemas: [
      {
        uri: `https://unpkg.com/@algoux/standard-ranklist@${srkPkg.version}/schema.json`,
        fileMatch: ['*'],
        schema: srkSchema,
      },
    ],
  };
}

export function getPlaygroundMonacoTheme(isDark: boolean): PlaygroundMonacoTheme {
  return isDark ? 'vs-dark' : 'vs-light';
}
