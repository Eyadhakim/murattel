import { MetaProvider, Title, Meta } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <MetaProvider>
          <Title>مرتّل - Murattel</Title>
          <Meta name="description" content="استمع إلى القرآن الكريم مع عرض الآيات لحظة بلحظة، بأصوات كبار القراء برواية حفص عن عاصم" />
          <Meta name="keywords" content="قرآن, تلاوة, استماع, آيات, قراء, حفص, مرتل, مصحف, سور القرآن" />
          <Meta name="theme-color" content="#c9a94a" />
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
