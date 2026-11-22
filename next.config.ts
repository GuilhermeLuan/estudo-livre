import type { NextConfig } from "next";

// O backup importado vai até 50 MB (AD-030); a folga cobre o envelope do multipart.
const LIMITE_DO_CORPO = "51mb";

const config: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: LIMITE_DO_CORPO },
    proxyClientMaxBodySize: LIMITE_DO_CORPO,
  },
};

export default config;
