import { MessageType, MethodRequestCallback } from './types';

export const createRpcCommunication = <IncomingMethodHandlers, OutcomingMethodCallers>(props: {
    outcomingMethods: (call: (method: string, args: any[]) => Promise<any>) => OutcomingMethodCallers;
    sendMessage: (message: any) => void;
}) => {
    let incomingMethodsHandlers: IncomingMethodHandlers = {} as IncomingMethodHandlers;
    const pendingOutcomingMethods = new Map<number, MethodRequestCallback>();

    const callOutcomingMethod = (method: string, args: any[]): Promise<any> => {
        const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

        const promise = new Promise((resolve, reject) => {
            pendingOutcomingMethods.set(id, (result, error) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
        props.sendMessage({ data: { args, id, method }, topic: 'request' });
        return promise;
    };

    const handleMessage = async (message: any): Promise<void> => {
        const { data, topic } = message as {
            data: { args: any[]; error: string; id: number; method: string; result: any };
            topic: MessageType;
        };

        switch (topic) {
            case 'request': {
                const method = (incomingMethodsHandlers as any)[data.method];
                if (!method) {
                    props.sendMessage({
                        data: { error: 'Method not found', id: data.id },
                        topic: 'error',
                    });
                    return;
                }

                try {
                    const result = await method(...data.args);
                    props.sendMessage({
                        data: { id: data.id, result },
                        topic: 'response',
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    props.sendMessage({
                        data: { error: errorMessage, id: data.id },
                        topic: 'error',
                    });
                }
                return;
            }

            case 'response': {
                const callback = pendingOutcomingMethods.get(data.id);
                if (callback) callback(data.result, null);
                return;
            }
            case 'error': {
                const callback = pendingOutcomingMethods.get(data.id);
                if (callback) callback(null, data.error);
                return;
            }
        }
    };

    const updateIncomingMethodHandlers = (handlers: IncomingMethodHandlers) => {
        incomingMethodsHandlers = handlers;
    };

    return {
        handleMessage,
        outcomingMethods: props.outcomingMethods(callOutcomingMethod),
        updateIncomingMethodHandlers,
    };
};

export type * from './types';
