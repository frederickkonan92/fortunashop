"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
require("./globals.css");
var google_1 = require("next/font/google");
var nunito = (0, google_1.Nunito)({
    subsets: ['latin'],
    weight: ['700', '800', '900'],
    variable: '--font-nunito',
});
var dmSans = (0, google_1.DM_Sans)({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-dm',
});
exports.metadata = {
    title: 'fortunashop — Boutique artisan',
    description: 'Votre boutique en ligne, livrée en 7 jours',
};
function RootLayout(_a) {
    var children = _a.children;
    return (<html lang="fr" className={"".concat(nunito.variable, " ").concat(dmSans.variable)}>
      <body className="font-dm bg-fs-cream text-fs-ink antialiased">
        {children}
      </body>
    </html>);
}
