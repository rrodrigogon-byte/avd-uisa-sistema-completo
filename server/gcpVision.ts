/**
 * GCP Vision API Integration
 * Helper para reconhecimento facial usando Google Cloud Vision API
 */

import { ENV } from "./_core/env";

// Tipos para GCP Vision API
interface FaceLandmark {
  type: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface FaceAnnotation {
  boundingPoly: {
    vertices: Array<{ x: number; y: number }>;
  };
  fdBoundingPoly: {
    vertices: Array<{ x: number; y: number }>;
  };
  landmarks: FaceLandmark[];
  rollAngle: number;
  panAngle: number;
  tiltAngle: number;
  detectionConfidence: number;
  landmarkingConfidence: number;
  joyLikelihood: string;
  sorrowLikelihood: string;
  angerLikelihood: string;
  surpriseLikelihood: string;
  underExposedLikelihood: string;
  blurredLikelihood: string;
  headwearLikelihood: string;
}

interface GCPVisionResponse {
  responses: Array<{
    faceAnnotations?: FaceAnnotation[];
    error?: {
      code: number;
      message: string;
      status: string;
    };
  }>;
}

interface FaceDescriptor {
  landmarks: FaceLandmark[];
  confidence: number;
  angles: {
    roll: number;
    pan: number;
    tilt: number;
  };
  quality: {
    detectionConfidence: number;
    landmarkingConfidence: number;
    blurred: string;
    underExposed: string;
  };
  boundingBox: {
    vertices: Array<{ x: number; y: number }>;
  };
}

/**
 * Detectar faces em uma imagem usando GCP Vision API
 */
export async function detectFaces(imageUrl: string): Promise<{
  success: boolean;
  facesDetected: number;
  faces: FaceAnnotation[];
  error?: string;
}> {
  try {
    // Nota: GCP Vision API requer uma API key configurada
    // Por enquanto, vamos usar a API do Manus que pode fazer proxy para GCP
    const apiUrl = ENV.builtInForgeApiUrl;
    const apiKey = ENV.builtInForgeApiKey;
    
    if (!apiUrl || !apiKey) {
      throw new Error("GCP Vision API credentials not configured");
    }
    
    // Fazer requisição para GCP Vision API
    const response = await fetch(`${apiUrl}/vision/detect-faces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        imageUrl,
        features: ["FACE_DETECTION", "FACE_LANDMARKS"],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GCP Vision API error: ${response.status} - ${errorText}`);
    }
    
    const data: GCPVisionResponse = await response.json();
    
    if (data.responses[0].error) {
      throw new Error(data.responses[0].error.message);
    }
    
    const faceAnnotations = data.responses[0].faceAnnotations || [];
    
    return {
      success: true,
      facesDetected: faceAnnotations.length,
      faces: faceAnnotations,
    };
  } catch (error) {
    console.error("[GCP Vision] Error detecting faces:", error);
    return {
      success: false,
      facesDetected: 0,
      faces: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extrair descritor facial de uma face detectada
 */
export function extractFaceDescriptor(face: FaceAnnotation): FaceDescriptor {
  return {
    landmarks: face.landmarks,
    confidence: face.detectionConfidence,
    angles: {
      roll: face.rollAngle,
      pan: face.panAngle,
      tilt: face.tiltAngle,
    },
    quality: {
      detectionConfidence: face.detectionConfidence,
      landmarkingConfidence: face.landmarkingConfidence,
      blurred: face.blurredLikelihood,
      underExposed: face.underExposedLikelihood,
    },
    boundingBox: {
      vertices: face.boundingPoly.vertices,
    },
  };
}

/**
 * Comparar duas faces e retornar score de similaridade
 */
export function compareFaces(
  descriptor1: FaceDescriptor,
  descriptor2: FaceDescriptor
): {
  matchScore: number;
  confidence: number;
  details: {
    landmarkSimilarity: number;
    angleSimilarity: number;
    qualityScore: number;
  };
} {
  // Calcular similaridade de landmarks (pontos faciais)
  const landmarkSimilarity = calculateLandmarkSimilarity(
    descriptor1.landmarks,
    descriptor2.landmarks
  );
  
  // Calcular similaridade de ângulos
  const angleSimilarity = calculateAngleSimilarity(
    descriptor1.angles,
    descriptor2.angles
  );
  
  // Calcular score de qualidade médio
  const qualityScore = (
    (descriptor1.quality.detectionConfidence + descriptor2.quality.detectionConfidence) / 2 +
    (descriptor1.quality.landmarkingConfidence + descriptor2.quality.landmarkingConfidence) / 2
  ) / 2;
  
  // Score final ponderado
  const matchScore = Math.round(
    landmarkSimilarity * 0.7 +
    angleSimilarity * 0.2 +
    qualityScore * 0.1
  );
  
  // Confiança baseada na qualidade das detecções
  const confidence = Math.round(
    (descriptor1.confidence + descriptor2.confidence) / 2 * 100
  );
  
  return {
    matchScore,
    confidence,
    details: {
      landmarkSimilarity: Math.round(landmarkSimilarity),
      angleSimilarity: Math.round(angleSimilarity),
      qualityScore: Math.round(qualityScore),
    },
  };
}

/**
 * Calcular similaridade entre landmarks de duas faces
 */
function calculateLandmarkSimilarity(
  landmarks1: FaceLandmark[],
  landmarks2: FaceLandmark[]
): number {
  if (landmarks1.length === 0 || landmarks2.length === 0) {
    return 0;
  }
  
  // Criar mapa de landmarks por tipo
  const map1 = new Map(landmarks1.map(l => [l.type, l.position]));
  const map2 = new Map(landmarks2.map(l => [l.type, l.position]));
  
  // Calcular distância euclidiana média entre landmarks correspondentes
  let totalDistance = 0;
  let count = 0;
  
  for (const [type, pos1] of map1.entries()) {
    const pos2 = map2.get(type);
    if (pos2) {
      const distance = Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2) +
        Math.pow(pos1.z - pos2.z, 2)
      );
      totalDistance += distance;
      count++;
    }
  }
  
  if (count === 0) return 0;
  
  const avgDistance = totalDistance / count;
  
  // Converter distância em score de similaridade (0-100)
  // Distância menor = maior similaridade
  // Assumindo que distância máxima relevante é 100
  const similarity = Math.max(0, 100 - (avgDistance * 2));
  
  return similarity;
}

/**
 * Calcular similaridade entre ângulos de duas faces
 */
function calculateAngleSimilarity(
  angles1: { roll: number; pan: number; tilt: number },
  angles2: { roll: number; pan: number; tilt: number }
): number {
  // Calcular diferença absoluta para cada ângulo
  const rollDiff = Math.abs(angles1.roll - angles2.roll);
  const panDiff = Math.abs(angles1.pan - angles2.pan);
  const tiltDiff = Math.abs(angles1.tilt - angles2.tilt);
  
  // Média das diferenças
  const avgDiff = (rollDiff + panDiff + tiltDiff) / 3;
  
  // Converter diferença em score de similaridade (0-100)
  // Diferença de 0° = 100%, diferença de 45° ou mais = 0%
  const similarity = Math.max(0, 100 - (avgDiff * 100 / 45));
  
  return similarity;
}

/**
 * Avaliar qualidade de uma foto para reconhecimento facial
 */
export function assessPhotoQuality(face: FaceAnnotation): {
  score: number;
  quality: "ruim" | "aceitavel" | "boa" | "excelente";
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  
  // Verificar confiança de detecção
  if (face.detectionConfidence < 0.7) {
    issues.push("Baixa confiança na detecção facial");
    recommendations.push("Tire uma foto mais clara e bem iluminada");
    score -= 30;
  } else if (face.detectionConfidence < 0.85) {
    issues.push("Confiança moderada na detecção");
    score -= 15;
  }
  
  // Verificar qualidade dos landmarks
  if (face.landmarkingConfidence < 0.7) {
    issues.push("Pontos faciais não detectados claramente");
    recommendations.push("Posicione o rosto de frente para a câmera");
    score -= 25;
  }
  
  // Verificar blur
  if (face.blurredLikelihood === "VERY_LIKELY" || face.blurredLikelihood === "LIKELY") {
    issues.push("Imagem desfocada");
    recommendations.push("Mantenha a câmera estável e foque no rosto");
    score -= 20;
  }
  
  // Verificar exposição
  if (face.underExposedLikelihood === "VERY_LIKELY" || face.underExposedLikelihood === "LIKELY") {
    issues.push("Imagem muito escura");
    recommendations.push("Melhore a iluminação do ambiente");
    score -= 20;
  }
  
  // Verificar ângulos da face
  const maxAngle = Math.max(
    Math.abs(face.rollAngle),
    Math.abs(face.panAngle),
    Math.abs(face.tiltAngle)
  );
  
  if (maxAngle > 30) {
    issues.push("Rosto muito inclinado");
    recommendations.push("Posicione o rosto de frente para a câmera");
    score -= 15;
  } else if (maxAngle > 15) {
    issues.push("Rosto levemente inclinado");
    score -= 5;
  }
  
  // Verificar headwear (chapéu, boné, etc)
  if (face.headwearLikelihood === "VERY_LIKELY" || face.headwearLikelihood === "LIKELY") {
    issues.push("Acessório na cabeça detectado");
    recommendations.push("Remova chapéus, bonés ou outros acessórios");
    score -= 10;
  }
  
  // Determinar qualidade geral
  let quality: "ruim" | "aceitavel" | "boa" | "excelente";
  if (score >= 90) {
    quality = "excelente";
  } else if (score >= 75) {
    quality = "boa";
  } else if (score >= 60) {
    quality = "aceitavel";
  } else {
    quality = "ruim";
  }
  
  return {
    score: Math.max(0, score),
    quality,
    issues,
    recommendations,
  };
}

/**
 * Validar se uma foto é adequada para cadastro facial
 */
export async function validatePhotoForRegistration(imageUrl: string): Promise<{
  valid: boolean;
  faceDetected: boolean;
  multipleFaces: boolean;
  qualityAssessment?: ReturnType<typeof assessPhotoQuality>;
  error?: string;
}> {
  const detection = await detectFaces(imageUrl);
  
  if (!detection.success) {
    return {
      valid: false,
      faceDetected: false,
      multipleFaces: false,
      error: detection.error,
    };
  }
  
  if (detection.facesDetected === 0) {
    return {
      valid: false,
      faceDetected: false,
      multipleFaces: false,
      error: "Nenhuma face detectada na imagem",
    };
  }
  
  if (detection.facesDetected > 1) {
    return {
      valid: false,
      faceDetected: true,
      multipleFaces: true,
      error: "Múltiplas faces detectadas. Por favor, tire uma foto com apenas uma pessoa",
    };
  }
  
  // Avaliar qualidade da foto
  const qualityAssessment = assessPhotoQuality(detection.faces[0]);
  
  // Foto é válida se qualidade for pelo menos "aceitável"
  const valid = qualityAssessment.score >= 60;
  
  return {
    valid,
    faceDetected: true,
    multipleFaces: false,
    qualityAssessment,
    error: valid ? undefined : "Qualidade da foto insuficiente para cadastro",
  };
}

/**
 * Comparar foto de validação com foto cadastrada
 */
export async function validateFaceMatch(
  validationPhotoUrl: string,
  registeredDescriptor: FaceDescriptor,
  threshold = 75
): Promise<{
  match: boolean;
  matchScore: number;
  confidence: number;
  details?: any;
  error?: string;
}> {
  const detection = await detectFaces(validationPhotoUrl);
  
  if (!detection.success) {
    return {
      match: false,
      matchScore: 0,
      confidence: 0,
      error: detection.error,
    };
  }
  
  if (detection.facesDetected === 0) {
    return {
      match: false,
      matchScore: 0,
      confidence: 0,
      error: "Nenhuma face detectada na foto de validação",
    };
  }
  
  if (detection.facesDetected > 1) {
    return {
      match: false,
      matchScore: 0,
      confidence: 0,
      error: "Múltiplas faces detectadas na foto de validação",
    };
  }
  
  // Extrair descritor da face detectada
  const validationDescriptor = extractFaceDescriptor(detection.faces[0]);
  
  // Comparar descritores
  const comparison = compareFaces(registeredDescriptor, validationDescriptor);
  
  // Determinar se há match baseado no threshold
  const match = comparison.matchScore >= threshold;
  
  return {
    match,
    matchScore: comparison.matchScore,
    confidence: comparison.confidence,
    details: comparison.details,
  };
}
