#!/usr/bin/env node

/**
 * mdsplit_bridge.js
 * Bridge script for using @scil/mdsplit-js package from DocuMind bash scripts
 * Ensures the package is resolved from DocuMind's dependencies, not user context
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        file: null,
        output: null,
        strategy: 'heading',
        level: 2
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg.startsWith('--file=')) {
            options.file = arg.substring(7);
        } else if (arg === '--file' && i + 1 < args.length) {
            options.file = args[++i];
        } else if (arg.startsWith('--output=')) {
            options.output = arg.substring(9);
        } else if (arg === '--output' && i + 1 < args.length) {
            options.output = args[++i];
        } else if (arg.startsWith('--strategy=')) {
            options.strategy = arg.substring(11);
        } else if (arg === '--strategy' && i + 1 < args.length) {
            options.strategy = args[++i];
        } else if (arg.startsWith('--level=')) {
            options.level = parseInt(arg.substring(8));
        } else if (arg === '--level' && i + 1 < args.length) {
            options.level = parseInt(args[++i]);
        }
    }

    return options;
}

// Try to import mdsplit package
async function importMdsplit() {
    try {
        // First try direct import
        const mdsplit = await import('@scil/mdsplit-js');
        return mdsplit.default || mdsplit;
    } catch (e) {
        try {
            // Fallback: try to resolve the module path first
            const { createRequire } = await import('module');
            const require = createRequire(import.meta.url);
            const mdsplitPath = require.resolve('@scil/mdsplit-js');
            const mdsplit = await import(mdsplitPath);
            return mdsplit.default || mdsplit;
        } catch (resolveError) {
            // Return error information as JSON
            console.error(JSON.stringify({
                success: false,
                error: 'mdsplit package not available',
                details: resolveError.message
            }));
            process.exit(1);
        }
    }
}

// Main function
async function main() {
    const options = parseArgs();

    // Validate required arguments
    if (!options.file || !options.output) {
        console.error(JSON.stringify({
            success: false,
            error: 'Missing required arguments: --file and --output are required'
        }));
        process.exit(1);
    }

    // Check if input file exists
    if (!fs.existsSync(options.file)) {
        console.error(JSON.stringify({
            success: false,
            error: 'Input file does not exist',
            file: options.file
        }));
        process.exit(1);
    }

    // Import mdsplit package
    const mdsplit = await importMdsplit();

    try {
        // Read input file
        const content = fs.readFileSync(options.file, 'utf8');

        // Ensure output directory exists
        if (!fs.existsSync(options.output)) {
            fs.mkdirSync(options.output, { recursive: true });
        }

        // Configure splitting options
        const splitOptions = {
            strategy: options.strategy,
            level: options.level,
            preserveLinks: true,
            generateIndex: true
        };

        // Split the content
        const chunks = mdsplit(content, splitOptions);

        // Generate filenames and write chunks
        const files = [];
        chunks.forEach((chunk, index) => {
            const filename = `${path.basename(options.file, '.md')}_${String(index + 1).padStart(3, '0')}.md`;
            const outputPath = path.join(options.output, filename);

            // Write chunk content
            fs.writeFileSync(outputPath, chunk.content || chunk);
            files.push(filename);
        });

        // Output success JSON
        console.log(JSON.stringify({
            success: true,
            chunks: chunks.length,
            outputDir: options.output,
            files: files,
            method: 'mdsplit',
            options: splitOptions
        }));

    } catch (error) {
        // Output error JSON
        console.error(JSON.stringify({
            success: false,
            error: error.message,
            file: options.file,
            options: options
        }));
        process.exit(1);
    }
}

// Run main function
main().catch(error => {
    console.error(JSON.stringify({
        success: false,
        error: 'Unexpected error',
        details: error.message
    }));
    process.exit(1);
});