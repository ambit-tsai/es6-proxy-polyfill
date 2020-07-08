import banner from './banner';
import babel from 'rollup-plugin-babel';
import {terser} from "rollup-plugin-terser";


export default {
    input: 'src/Proxy.js',
    output: {
        file: 'test/browser/proxy-polyfill.js',
        format: 'umd',
        name: 'Proxy',
        banner,
    },
    plugins: [
        babel({
            presets: [
                ['@babel/preset-env', {
                    loose: true,
                }],
            ],
            plugins: [
                ['@babel/plugin-proposal-class-properties', {
                    loose: true,
                }],
            ],
        }),
        terser({
            ie8: true,
            compress: false,
            mangle: false,
            output: {
                beautify: true,
            },
        }),
    ],
};