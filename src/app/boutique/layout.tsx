import { BoutiqueCartProvider } from "@/components/boutique/BoutiqueCartProvider";
import { BoutiquePublicChrome } from "@/components/boutique/BoutiquePublicChrome";

export default function BoutiqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BoutiqueCartProvider>
      <BoutiquePublicChrome>{children}</BoutiquePublicChrome>
    </BoutiqueCartProvider>
  );
}
