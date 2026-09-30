export function bossBuildFlag(explicitFlag, deploymentEnvironment) {
  if (explicitFlag !== undefined && explicitFlag !== '') return explicitFlag === 'true' ? 'true' : 'false';
  return deploymentEnvironment === 'preview' ? 'true' : 'false';
}
