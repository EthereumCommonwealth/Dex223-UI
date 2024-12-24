export type ContentType = "video" | "vide_and_content" | "content";

export type Post = {
  id: string;
  title: string;
  slug: string;
  description: string;
  is_published: false;
  thumbnail: {
    id: string;
    link: string;
    alt: string;
  };
  tags: string[];
  author: null;
  createdAt: string;
  updatedAt: string;
  links: [
    {
      id: string;
      link: string;
      alt: null;
    },
  ];
};

export type PostDetails = {
  id: string;
  title: string;
  slug: string;
  description: string;
  is_published: false;
  thumbnail: {
    id: string;
    link: string;
    alt: string;
  };
  tags: string[];
  author: null | { name: string; email: string; id: string };
  createdAt: string;
  updatedAt: string;
  links: [
    {
      id: string;
      link: string;
      alt: null;
    },
  ];
  medias: [];
  content: ContentType;
  content_markdown: string;
  keyword_seed: null;
  language_code: string;
};
