import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'subhanahmed047',
  repo: 'availability',
  branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'availability-js',
    },
    links: [
      { text: 'GitHub', url: `https://github.com/${gitConfig.user}/${gitConfig.repo}` },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
