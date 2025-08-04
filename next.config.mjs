/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // TODO: figure out how to get rid of this?
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
