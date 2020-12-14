export declare const appJsonSchema: {
    $schema: string;
    title: string;
    description: string;
    type: string;
    properties: {
        id: {
            description: string;
            type: string;
            pattern: string;
            minLength: number;
            maxLength: number;
        };
        name: {
            description: string;
            type: string;
        };
        nameSlug: {
            description: string;
            type: string;
            pattern: string;
            minLength: number;
        };
        version: {
            description: string;
            type: string;
            pattern: string;
            minLength: number;
        };
        description: {
            description: string;
            type: string;
        };
        requiredApiVersion: {
            description: string;
            type: string;
            pattern: string;
            minLength: number;
        };
        author: {
            type: string;
            properties: {
                name: {
                    description: string;
                    type: string;
                };
                support: {
                    description: string;
                    type: string;
                };
                homepage: {
                    description: string;
                    type: string;
                    format: string;
                };
            };
            required: string[];
        };
        classFile: {
            type: string;
            description: string;
            pattern: string;
        };
        iconFile: {
            type: string;
            description: string;
            pattern: string;
        };
        assetsFolder: {
            type: string;
            description: string;
        };
    };
    required: string[];
};
