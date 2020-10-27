const rollup = require('rollup');
const { terser } = require('rollup-plugin-terser');
const banner = require('./banner');


(async () => {
    const bundle = await rollup.rollup({
        input: 'src/index.js',
        plugins: [
            terser(),
        ],
    });

    // Create the UMD version
    await bundle.write({
        file: 'dist/es6-proxy-polyfill.js',
        format: 'umd',
        banner,
        name: 'Proxy',
    });

    // Create the ESM version
    await bundle.write({
        file: 'dist/es6-proxy-polyfill.mjs',
        format: 'esm',
        banner,
    });

})();

