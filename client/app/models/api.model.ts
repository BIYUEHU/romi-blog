import { AuthUser } from "./api.model";

export * from "../../output";

export interface Author {
  username: string;
  avatar: string;
}

export interface RelatedPost {
  url: string;
  title: string;
  type: "prev" | "next";
}

export type UserAuthData = AuthUser & { token: string };

export interface BangumiData {
  data: {
    subject_id: number;
    tags: string[];
    subject: {
      name: string;
      images: {
        medium: string;
      };
      short_summary: string;
      eps?: number;
      date: string;
    };
  }[];
  total: number;
}
