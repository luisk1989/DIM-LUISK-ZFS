
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractDataFromDocument(
  base64Data: string,
  mimeType: string,
  fileName: string,
  userInstructions: string
): Promise<ExtractionResult> {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analiza este documento PDF/Imagen que contiene una o varias declaraciones de importación (DIM/Formularios).
    
    INSTRUCCIONES CRÍTICAS DE EXTRACCIÓN:
    1. Identifica TODAS las declaraciones o formularios diferentes que aparezcan en el archivo. Cada uno debe ser una fila independiente.
    2. Extrae la siguiente información técnica para cada declaración, buscando específicamente por el número de casilla y su etiqueta asociada:
       - ID del documento: Número de declaración o DIM.
       - Casilla 42: Manifiesto de carga.
       - Casilla 44: Documento de Transporte (Doc T).
       - Casilla 51 (FACTURA): ATENCIÓN - Esta casilla puede contener números y letras (alfanumérico). Extrae TODO el contenido de la casilla 51.
       - Casilla 54 (TRANS/TRANSPORTE).
       - Casilla 55 (BANDERA).
       - Casilla 58 (T CAMBIO/TIPO DE CAMBIO).
       - Casilla 59 (SUB/SUBTOTAL).
       - Casilla 66 (P ORIGEN/PAÍS ORIGEN).
       - Casilla 70 (P COMPRA/PAÍS COMPRA).
       - Casilla 71 (P. BRUTO).
       - Casilla 72 (P. NETO).
       - Casilla 73 (EMBALAJE/GASTOS EMBALAJE): Código de texto (ej: PK, BX, CT, UN, etc.).
       - Casilla 74 (BULTO).
       - Casilla 77 (CANTIDAD).
       - Casilla 78 (FOB).
       - Casilla 82 (SUM. G / SUMA GASTOS).
       - Casilla 134 (LEVANTE): Número de levante o autorización (alfanumérico).
    
    3. REGLAS DE FORMATO:
       - Casillas de texto (docId, 42, 44, 51, 73, 134): Extrae el texto tal cual aparece.
       - Casillas numéricas (54, 55, 58, 59, 66, 70, 71, 72, 74, 77, 78, 82): Solo el valor numérico. Si está vacía, usa 0.
    
    Notas adicionales: ${userInstructions}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          declarations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                docId: { type: Type.STRING },
                c42: { type: Type.STRING },
                c44: { type: Type.STRING },
                c51: { type: Type.STRING },
                c54: { type: Type.NUMBER },
                c55: { type: Type.NUMBER },
                c58: { type: Type.NUMBER },
                c59: { type: Type.NUMBER },
                c66: { type: Type.NUMBER },
                c70: { type: Type.NUMBER },
                c71: { type: Type.NUMBER },
                c72: { type: Type.NUMBER },
                c73: { type: Type.STRING },
                c74: { type: Type.NUMBER },
                c77: { type: Type.NUMBER },
                c78: { type: Type.NUMBER },
                c82: { type: Type.NUMBER },
                c134: { type: Type.STRING }
              },
              required: ["docId", "c42", "c44", "c51", "c54", "c55", "c58", "c59", "c66", "c70", "c71", "c72", "c73", "c74", "c77", "c78", "c82", "c134"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["declarations", "summary"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    const declarations = (data.declarations || []).map((d: any) => ({
      ...d,
      fileName
    }));
    return { declarations, summary: data.summary };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    throw new Error("No se pudo procesar la estructura contable. Verifica la legibilidad del documento.");
  }
}
