import type { NangoSyncEndpoint, NangoSyncModel, HTTP_VERB } from '../types';
import { isProd } from './utils';

const maskedKey = '<secret-key-from-environment-settings>';

export const nodeSnippet = (models: string | NangoSyncModel[] | undefined, secretKey: string, connectionId: string, providerConfigKey: string) => {
    const model = Array.isArray(models) ? models[0]?.name : models;
    const secretKeyDisplay = isProd() ? maskedKey : secretKey;

    return `import { Nango } from '@nangohq/node';
const nango = new Nango({ secretKey: '${secretKeyDisplay}' });

const records = await nango.listRecords({
    providerConfigKey: '${providerConfigKey}',
    connectionId: '${connectionId}',
    model: '${model}'
});
`;
};

export const nodeActionSnippet = (
    actionName: string,
    secretKey: string,
    connectionId: string,
    providerConfigKey: string,
    input?: Record<string, any> | string,
    safeInput?: boolean
) => {
    let formattedInput = '';
    if (!safeInput) {
        if (typeof input === 'string') {
            formattedInput = `'<${input}>'`;
        } else if (input && typeof input === 'object') {
            formattedInput = `{
${JSON.stringify(input, null, 2)
    .split('\n')
    .slice(1)
    .join('\n')
    .replace(/^/gm, '    ')
    .replace(/: "([^"]*)"/g, ': "<$1>"')}`;
        }
    } else {
        formattedInput = `{
${JSON.stringify(input, null, 2).split('\n').slice(1).join('\n').replace(/^/gm, '    ')}`;
    }

    const secretKeyDisplay = isProd() ? maskedKey : secretKey;

    return `import Nango from '@nangohq/node';
const nango = new Nango({ secretKey: '${secretKeyDisplay}' });

const response = await nango.triggerAction(
    '${providerConfigKey}',
    '${connectionId}',
    '${actionName}',
    ${formattedInput}
);
`;
};

export const curlSnippet = (
    baseUrl: string,
    endpoint: string | NangoSyncEndpoint | NangoSyncEndpoint[],
    secretKey: string,
    connectionId: string,
    providerConfigKey: string,
    input?: Record<string, any> | string,
    method = 'GET'
) => {
    let curlMethod: HTTP_VERB = method as HTTP_VERB;
    const secretKeyDisplay = isProd() ? maskedKey : secretKey;
    if (typeof endpoint !== 'string') {
        curlMethod = Object.keys(endpoint)[0] as HTTP_VERB;
        endpoint = (Array.isArray(endpoint) ? endpoint[0][curlMethod] : endpoint[curlMethod]) as string;
    }

    let formattedInput = '';
    if (typeof input === 'string' && input !== 'undefined') {
        formattedInput = input;
    } else if (input && typeof input === 'object') {
        formattedInput = `{
${JSON.stringify(input, null, 2)
    .split('\n')
    .slice(1)
    .join('\n')
    .replace(/^/gm, '    ')
    .replace(/: "([^"]*)"/g, ': "<$1>"')}`;
    }

    return `
    curl --request ${curlMethod} \\
    --url ${baseUrl}/v1${endpoint} \\
    --header 'Authorization: Bearer ${secretKeyDisplay}' \\
    --header 'Content-Type: application/json' \\
    --header 'Connection-Id: ${connectionId}' \\
    --header 'Provider-Config-Key: ${providerConfigKey}' ${formattedInput ? '\\' : ''}
    ${formattedInput ? `--data '${formattedInput}'` : ''}
        `;
};

export const autoStartSnippet = (secretKey: string, provider: string, sync: string) => {
    const secretKeyDisplay = isProd() ? maskedKey : secretKey;
    return `import Nango from '@nangohq/node';

const nango = new Nango({ secretKey: '${secretKeyDisplay}' });

await nango.startSync('${provider}', ['${sync}'], '<CONNECTION-ID>');
`;
};

export const setMetadaSnippet = (secretKey: string, provider: string, input: Record<string, any>) => {
    return `import Nango from '@nangohq/node';

const nango = new Nango({ secretKey: '${secretKey}' });

await nango.setMetadata(
    '${provider}',
    '<CONNECTION-ID>',
    ${input ? `{\n${JSON.stringify(input, null, 2).split('\n').slice(1).join('\n').replace(/^/gm, '    ')}` : ''}
);
`;
};
