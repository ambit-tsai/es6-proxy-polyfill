import banner from './banner';
import babel from 'rollup-plugin-babel';


export default {
    input: 'src/Proxy.js',
    output: {
        file: 'dist/proxy-polyfill.mjs',
        format: 'es',
        banner,
        sourcemap: true,
    },
    plugins: [
        babel({
            presets: [
                ['@babel/preset-env', {
                    loose: true,
                }]
            ],
        }),
    ],
};