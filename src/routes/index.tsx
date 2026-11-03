import { createFileRoute } from "@tanstack/react-router";
import App from "@/app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Convo — もかげチャット" },
      { name: "description", content: "友達募集・コミュニティ・タイムライン・チャットが楽しめるコミュニケーションアプリ。" },
      { property: "og:title", content: "Convo — もかげチャット" },
      { property: "og:description", content: "友達募集・コミュニティ・タイムライン・チャットが楽しめるコミュニケーションアプリ。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});
