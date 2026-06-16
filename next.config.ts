import type { NextConfig } from "next"
import { codeInspectorPlugin } from 'code-inspector-plugin';


const nextConfig: NextConfig = {
    turbopack: {
        rules: codeInspectorPlugin({
            bundler: 'turbopack',
            showSwitch: true,
            editor: 'code'
        }),
    },
}

export default nextConfig
