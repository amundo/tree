import { join, globToRegExp } from "@std/path";
import { parseArgs } from "jsr:@std/cli/parse-args";

const VERSION = '1.0.0'; // Version of the script

const CONFIG_FILE = join(Deno.cwd(), ".tree.json"); // Config file path

async function readTreeConfig() {
  try {
    const configData = await Deno.readTextFile(CONFIG_FILE);
    const config = JSON.parse(configData);
    return Array.isArray(config.exclude) ? config.exclude : [];
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    console.error(`Error reading .tree.json: ${error.message}`);
    return [];
  }
}

async function updateTreeConfig(newExcludes) {
  let config = {};
  try {
    const configData = await Deno.readTextFile(CONFIG_FILE);
    config = JSON.parse(configData);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      console.error(`Error reading .tree.json: ${error.message}`);
    }
  }
  config.exclude = [...new Set([...(config.exclude || []), ...newExcludes])];

  try {
    await Deno.writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(`Updated .tree.json with excludes: ${newExcludes.join(", ")}`);
  } catch (error) {
    console.error(`Error writing .tree.json: ${error.message}`);
  }
}

function matchesExcludePatterns(name, excludePatterns) {
  return excludePatterns.some((pattern) => pattern.test(name));
}

async function tree(dir = ".", depth = Infinity, prefix = "", showFiles = true, excludePatterns = []) {
  try {
    const entries = Array.from(Deno.readDirSync(dir))
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((entry) => !matchesExcludePatterns(entry.name, excludePatterns));

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLast = i === entries.length - 1;
      const newPrefix = prefix + (isLast ? "└── " : "├── ");
      const subPrefix = prefix + (isLast ? "    " : "│   ");

      console.log(newPrefix + entry.name);

      if (entry.isDirectory && depth > 1) {
        await tree(join(dir, entry.name), depth - 1, subPrefix, showFiles, excludePatterns);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}
function showHelp() {
  console.log(`
Usage: tree [options] [directory]

Options:
  --help          Show this help message
  --files-only    Show files only (default: true)
  --version       Show version
  --dirs-only     Show directories only
  --depth <n>     Set the depth limit for directory traversal
  --exclude <pat> Exclude files matching the given pattern (comma-separated)

Configuration:
  The script can read a configuration file named \`.tree.json\` in the current directory.
  This file allows specifying directories or files to exclude globally.

  Example .tree.json format:
  {
    "exclude": [
      "node_modules",
      "dist",
      "*.log"
    ]
  }

  - The "exclude" field is an array of glob patterns.
  - These patterns will be applied every time the script runs.
  - New exclusions added via \`--exclude\` will be merged into this file.

Examples:
  tree --depth 2
  tree --dirs-only
  tree --exclude node_modules,dist
  tree some/directory --depth 3
`);
}

const args = parseArgs(Deno.args, {
  boolean: ["help", "files-only", "dirs-only", "version"],
  string: ["depth", "exclude"],
  default: { "files-only": true },
  alias: { h: "help" , v: "version", d: "depth", e: "exclude" },
});

if (args.help) {
  showHelp();
  Deno.exit(0);
}

if (args.version){
  console.log(`tree version ${VERSION}`);
  Deno.exit(0);
}



const dir = args._[0] || ".";
const depth = args.depth ? parseInt(args.depth) : Infinity;
const showFiles = args["files-only"] || !args["dirs-only"];
const newExcludes = args.exclude ? args.exclude.split(",") : [];

// Load exclude list from .tree.json
let excludes = await readTreeConfig();
if (newExcludes.length > 0) {
  await updateTreeConfig(newExcludes);
  excludes = [...excludes, ...newExcludes]; // Ensure new excludes are applied
}

const excludePatterns = excludes.map((pattern) => globToRegExp(pattern));

// Run the tree command
await tree(dir, depth, "", showFiles, excludePatterns);
