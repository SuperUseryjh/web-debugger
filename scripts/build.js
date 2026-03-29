import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

const userscriptHeader = `// ==UserScript==
// @name         现代化网络请求调试助手
// @namespace    http://tampermonkey.net/
// @version      2.2.0
// @description  现代化 UI 设计，模块化拦截逻辑，支持 Fetch/XHR/WebSocket 深度监控
// @author       YaoOnion
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==
`;

async function build() {
  const ctx = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/web-debugger.user.js',
    format: 'iife',
    target: 'es2020',
    minify: isProduction,
    sourcemap: !isProduction,
    treeShaking: true,
    drop: isProduction ? ['console', 'debugger'] : [],
    banner: {
      js: userscriptHeader
    },
    logLevel: 'info'
  });

  if (isWatch) {
    await ctx.watch();
    console.log('👀 Watching for changes...');
  } else {
    await ctx.rebuild();
    console.log('✅ Build completed successfully!');
    console.log(`📦 Output: dist/web-debugger.user.js`);
    
    const stats = fs.statSync('dist/web-debugger.user.js');
    console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    await ctx.dispose();
  }
}

build().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
