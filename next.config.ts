import type { NextConfig } from "next";
import { PROJECTS } from "./src/lib/projects";
import { projectHref } from "./src/lib/routes";

// Projects used to live at /<slug>; they now live at /projects/<slug> (see
// src/lib/routes.ts). Old links, bookmarks and anything already indexed keep
// working through a 308 per project — two sources each, because a bare
// /<slug> and /<slug>/<page> are different patterns:
//
//   /vue            -> /projects/vue
//   /vue/:path*     -> /projects/vue/:path*
//
// Generated from the registry, so adding a project to PROJECTS covers it
// automatically. These are EXPLICIT per slug, never a catch-all: nothing here
// can match /, /projects/*, /_next/*, /api/* or any other route, which also
// rules out a redirect loop.
//
// The URL fragment is never sent to the server; browsers re-apply it to the
// redirect target on their own, so /vue/guards#x lands on
// /projects/vue/guards#x. Query strings are carried over by Next.
function projectRedirects() {
    return PROJECTS.flatMap((project) => {
        const destination = projectHref(project.slug);
        return [
            { source: `/${project.slug}`, destination, permanent: true },
            {
                source: `/${project.slug}/:path*`,
                destination: `${destination}/:path*`,
                permanent: true,
            },
        ];
    });
}

const nextConfig: NextConfig = {
    async redirects() {
        return projectRedirects();
    },
};

export default nextConfig;
