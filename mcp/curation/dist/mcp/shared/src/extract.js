import mammoth from "mammoth";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
export const MARCADOR_PAGINA = "[[PAGINA]]";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ODT_MIME = "application/vnd.oasis.opendocument.text";
function escaparExpresion(valor) {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function normalizarTexto(texto) {
    return texto
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
export function dividirEnPaginas(texto) {
    const partes = texto
        .split(/\[\[PAGINA\]\]|\f|<!--\s*(?:pagebreak|salto[- ]?de[- ]?pagina|pagina)\s*-->/i)
        .map(normalizarTexto)
        .filter(Boolean);
    return partes.length > 0 ? partes : [];
}
function esImagen(nombre) {
    return /\.(png|jpe?g|webp|gif)$/i.test(nombre);
}
function aDataUrl(buffer, nombre) {
    if (/\.png$/i.test(nombre))
        return `data:image/png;base64,${buffer.toString("base64")}`;
    if (/\.gif$/i.test(nombre))
        return `data:image/gif;base64,${buffer.toString("base64")}`;
    if (/\.webp$/i.test(nombre))
        return `data:image/webp;base64,${buffer.toString("base64")}`;
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
function prepararXmlOdt(xml) {
    const estilos = Array.from(xml.matchAll(/<style:style\b[^>]*style:name="([^"]+)"[^>]*>([\s\S]*?)<\/style:style>/g))
        .filter((coincidencia) => /fo:break-before="page"/.test(coincidencia[2]))
        .map((coincidencia) => coincidencia[1]);
    let resultado = xml.replace(/<text:soft-page-break\s*\/>/g, MARCADOR_PAGINA);
    for (const estilo of estilos) {
        const patron = new RegExp(`<text:(p|h)\\b[^>]*text:style-name="${escaparExpresion(estilo)}"`, "g");
        resultado = resultado.replace(patron, (_todo, etiqueta) => `${MARCADOR_PAGINA}<text:${etiqueta}`);
    }
    return resultado;
}
function caminarXml(nodo, salida) {
    if (nodo === null || nodo === undefined)
        return;
    if (typeof nodo === "string" || typeof nodo === "number") {
        salida.push(String(nodo));
        return;
    }
    if (Array.isArray(nodo)) {
        nodo.forEach((hijo) => caminarXml(hijo, salida));
        return;
    }
    if (typeof nodo !== "object")
        return;
    for (const [clave, valor] of Object.entries(nodo)) {
        if (clave === "#text") {
            salida.push(String(valor));
            continue;
        }
        if (clave === "p" || clave === "h") {
            caminarXml(valor, salida);
            salida.push("\n");
            continue;
        }
        caminarXml(valor, salida);
    }
}
async function extraerOdt(buffer, nombre) {
    const zip = await JSZip.loadAsync(buffer);
    const archivoContenido = zip.file("content.xml");
    if (!archivoContenido)
        throw new Error("ODT inválido: falta content.xml");
    const xml = prepararXmlOdt(await archivoContenido.async("string"));
    const parser = new XMLParser({ removeNSPrefix: true, ignoreAttributes: true });
    const arbol = parser.parse(xml);
    const partes = [];
    caminarXml(arbol, partes);
    const texto = normalizarTexto(partes.join(""));
    const imagenes = [];
    for (const ruta of Object.keys(zip.files)) {
        if (!ruta.startsWith("Pictures/") || !esImagen(ruta) || zip.files[ruta].dir)
            continue;
        const datos = await zip.files[ruta].async("nodebuffer");
        imagenes.push({
            nombre: ruta.split("/").pop() ?? `imagen-${imagenes.length + 1}`,
            dataUrl: aDataUrl(datos, ruta),
        });
    }
    return construir(texto, imagenes, nombre, ODT_MIME, "odt");
}
function prepararXmlDocx(xml) {
    const estilos = Array.from(xml.matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g))
        .filter((coincidencia) => /<w:pageBreakBefore\b/.test(coincidencia[2]))
        .map((coincidencia) => coincidencia[1]);
    let resultado = xml
        .replace(/<w:br\b[^>]*w:type="page"[^>]*\/?>/g, MARCADOR_PAGINA)
        .replace(/<w:lastRenderedPageBreak\s*\/>/g, MARCADOR_PAGINA)
        .replace(/<w:br\s*\/>/g, "\n");
    for (const estilo of estilos) {
        const patron = new RegExp(`<w:p\\b[^>]*<w:pStyle w:val="${escaparExpresion(estilo)}"`, "g");
        resultado = resultado.replace(patron, (todo) => `${MARCADOR_PAGINA}${todo}`);
    }
    return resultado;
}
function textoDesdeXmlDocx(xml) {
    return xml
        .replace(/<\/w:p>/g, "\n")
        .replace(/<w:tab\s*\/>/g, "\t")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
async function extraerImagenesDocx(buffer) {
    const imagenes = [];
    try {
        await mammoth.convertToHtml({ buffer }, {
            convertImage: mammoth.images.imgElement(async (image) => {
                const datos = await image.read("base64");
                const nombreImagen = `imagen-${imagenes.length + 1}.${image.contentType.split("/")[1] ?? "png"}`;
                imagenes.push({ nombre: nombreImagen, dataUrl: `data:${image.contentType};base64,${datos}` });
                return { src: `data:${image.contentType};base64,${datos}` };
            }),
        });
    }
    catch {
        return [];
    }
    return imagenes;
}
async function extraerDocx(buffer, nombre) {
    const zip = await JSZip.loadAsync(buffer);
    const archivo = zip.file("word/document.xml");
    if (!archivo)
        throw new Error("DOCX inválido: falta word/document.xml");
    const xml = prepararXmlDocx(await archivo.async("string"));
    const texto = normalizarTexto(textoDesdeXmlDocx(xml));
    const imagenes = await extraerImagenesDocx(buffer);
    return construir(texto, imagenes, nombre, DOCX_MIME, "docx");
}
function construir(texto, imagenes, nombre, mime, formato) {
    const paginas = dividirEnPaginas(texto);
    return {
        texto,
        paginas,
        imagenes,
        metadatos: { nombre, mime, formato, caracteres: texto.length, paginas: paginas.length },
    };
}
export async function extraerDocumento(buffer, mime, nombre) {
    if (mime === DOCX_MIME || /\.docx$/i.test(nombre))
        return extraerDocx(buffer, nombre);
    if (mime === ODT_MIME || /\.odt$/i.test(nombre))
        return extraerOdt(buffer, nombre);
    if (mime.startsWith("text/") || /\.(md|markdown|txt)$/i.test(nombre)) {
        return construir(buffer.toString("utf8"), [], nombre, mime, "md");
    }
    throw new Error(`Formato no soportado: ${mime}`);
}
