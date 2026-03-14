import { ssr, ssrHydrationKey, escape, createComponent } from "solid-js/web";
import { T as Title, H as HttpStatusCode } from "../../entry-server.js";
import "solid-js";
import "pathe";
import "radix3";
import "seroval";
import "seroval-plugins/web";
import "h3";
import "solid-js/web/storage";
import "cookie-es";
var _tmpl$ = ["<main", "><!--$-->", "<!--/--><!--$-->", '<!--/--><h1>Page Not Found</h1><p>Visit <a href="https://start.solidjs.com" target="_blank">start.solidjs.com</a> to learn how to build SolidStart apps.</p></main>'];
const id$$ = "src/routes/[...404].tsx?pick=default&pick=$css";
function NotFound() {
  return ssr(_tmpl$, ssrHydrationKey(), escape(createComponent(Title, {
    children: "Not Found"
  })), escape(createComponent(HttpStatusCode, {
    code: 404
  })));
}
export {
  NotFound as default,
  id$$
};
//# sourceMappingURL=_...404_-DayZDE5a.js.map
