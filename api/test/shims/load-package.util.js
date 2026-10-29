// Jest-only stand-in for @nestjs/common/utils/load-package.util.js, whose
// `import.meta.url` cannot be compiled to the CommonJS that Jest runs on
// Node < 24.9. Same exports and behaviour, using plain `require`.
// Not needed once Node >= 24.9 (Jest then loads ES modules natively).
const packageCache = new Map();

function missing(name, reason) {
  console.error(
    `The "${name}" package is missing. Please, make sure to install it to use ${reason}.`,
  );
  process.exit(1);
}

async function loadPackage(packageName, context, loaderFn) {
  if (packageCache.has(packageName)) return packageCache.get(packageName);
  try {
    const pkg = loaderFn ? await loaderFn() : require(packageName);
    packageCache.set(packageName, pkg);
    return pkg;
  } catch {
    return missing(packageName, context);
  }
}

function loadPackageSync(packageName, context, loaderFn) {
  if (packageCache.has(packageName)) return packageCache.get(packageName);
  try {
    const pkg = loaderFn ? loaderFn() : require(packageName);
    packageCache.set(packageName, pkg);
    return pkg;
  } catch {
    return missing(packageName, context);
  }
}

function loadPackageCached(packageName, context) {
  if (packageCache.has(packageName)) return packageCache.get(packageName);
  if (context) return loadPackageSync(packageName, context);
  throw new Error(`Package "${packageName}" has not been loaded yet.`);
}

async function tryLoadPackage(packageName, loaderFn) {
  if (packageCache.has(packageName)) return packageCache.get(packageName);
  try {
    const pkg = loaderFn ? await loaderFn() : require(packageName);
    packageCache.set(packageName, pkg);
    return pkg;
  } catch {
    return null;
  }
}

module.exports = { loadPackage, loadPackageSync, loadPackageCached, tryLoadPackage };
