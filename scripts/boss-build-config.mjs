export function bossBuildFlag(explicitFlag, deploymentEnvironment) {
  if (explicitFlag !== undefined && explicitFlag !== '') return explicitFlag === 'true' ? 'true' : 'false';
  // Deployed UI may expose test-account gameplay; database access remains authoritative.
  return ['preview', 'production'].includes(deploymentEnvironment) ? 'true' : 'false';
}
