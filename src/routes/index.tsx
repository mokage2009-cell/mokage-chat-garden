import { createFileRoute } from "@tanstack/react-router";
import capturedCSS from "../styles/site.css?inline";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Convo Chat App Prototype" }] }),
  component: Index,
});

function Index() {
  return (
    <>
      <style>{capturedCSS.replace(/(<\/|<)(s)(tyle)/gi, (_, prefix, letter, rest) => prefix + (letter === "s" ? "\\73 " : "\\53 ") + rest)}</style>
      <div>
        <div id="root" />
      </div>
    </>
  );
}
