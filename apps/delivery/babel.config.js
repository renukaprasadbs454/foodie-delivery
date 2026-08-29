module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        'react': './node_modules/react',
                        'react-native': './node_modules/react-native',
                        'react-redux': './node_modules/react-redux',
                        '@react-navigation/native': './node_modules/@react-navigation/native',
                        '@babel/runtime': './node_modules/@babel/runtime',
                    },
                },
            ],
        ],
    };
};
