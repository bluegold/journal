import { assetManifest, type AssetName } from './asset-manifest.generated'

export const assetUrl = (name: AssetName) => assetManifest[name]
