import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { site } from "../data/site.js";

const WaIcon = () => (
  <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" fill="currentColor">
    <path d="M16.04 3C9.4 3 4 8.38 4 15c0 2.34.68 4.61 1.96 6.56L4 29l7.66-1.98A12.04 12.04 0 0 0 16.04 27C22.66 27 28 21.62 28 15S22.66 3 16.04 3Zm0 21.8c-1.86 0-3.68-.5-5.27-1.45l-.38-.22-4.55 1.18 1.21-4.42-.25-.4A9.72 9.72 0 0 1 6.27 15c0-5.38 4.39-9.76 9.77-9.76 5.37 0 9.73 4.38 9.73 9.76 0 5.39-4.36 9.8-9.73 9.8Zm5.35-7.32c-.29-.15-1.73-.85-2-.95-.27-.1-.47-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.23-.45-2.35-1.44-.87-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.82 1.19 3.01.15.2 2.06 3.14 4.98 4.4.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.73-.7 1.97-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.2-.56-.34Z" />
  </svg>
);

// Floating WhatsApp chat button. The number and greeting are set in data/site.js.
export default function WhatsAppButton() {
  const [tip, setTip] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("aedt_wa_tip") === "1"; } catch { /* ignore */ }
    if (seen) return;
    const a = setTimeout(() => setTip(true), 4000);
    const b = setTimeout(() => setTip(false), 12000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (!site.whatsapp) return null;
  const close = () => { setTip(false); try { sessionStorage.setItem("aedt_wa_tip", "1"); } catch { /* ignore */ } };
  const href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappMessage || "")}`;
  return (
    <div className="wa notranslate" translate="no">
      {tip && (
        <div className="wa-tip" role="status">
          <b>Questions?</b> Chat with us on WhatsApp.
          <button type="button" aria-label="Close" onClick={close}><X size={14} /></button>
        </div>
      )}
      <a className="wa-btn" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" onClick={close}>
        <WaIcon />
      </a>
    </div>
  );
}