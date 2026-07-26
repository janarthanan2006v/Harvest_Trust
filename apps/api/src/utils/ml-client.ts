import { spawn } from 'child_process';
import path from 'path';

const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';
const ML_PREDICT_SCRIPT = path.join(process.cwd(), '../../ml/predict.py');

export interface PredictionFeatures {
  produceCode: string;
  collectionPointCode: string;
  quantity: number;
  ratePerUnit: number;
  grossAmount: number;
  qualityGrade: string | null;
  moisturePercent: number | null;
  hourOfDay: number;
  dayOfWeek: number;
  qtyDiffFromAvg: number;
  rateDiffFromMedian: number;
  priorAttentionCount: number;
  priorDeliveriesCount: number;
  hasNotes: number; // 1 or 0
}

export interface PredictionResult {
  predictedClass: 'ATTENTION' | 'NORMAL' | null;
  probability: number;
  explanation: string;
  modelVersion: string;
  confidenceThreshold: number;
  error?: string;
}

export function getMLPrediction(features: PredictionFeatures): Promise<PredictionResult> {
  return new Promise((resolve) => {
    const timeoutMs = 5000;
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[ML Client] Prediction timed out. Falling back to default.');
        resolve({
          predictedClass: null,
          probability: 0.0,
          explanation: 'Prediction timed out',
          modelVersion: 'unknown',
          confidenceThreshold: 0.65,
          error: 'TIMEOUT',
        });
      }
    }, timeoutMs);

    try {
      const child = spawn(PYTHON_PATH, [ML_PREDICT_SCRIPT], {
        env: { ...process.env },
      });

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (resolved) return;
        resolved = true;

        if (code !== 0) {
          console.error(`[ML Client] python script exited with code ${code}. Error: ${stderrData}`);
          resolve({
            predictedClass: null,
            probability: 0.0,
            explanation: 'Prediction service failed',
            modelVersion: 'unknown',
            confidenceThreshold: 0.65,
            error: 'EXIT_CODE_ERROR',
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData.trim());
          resolve(result);
        } catch (e: any) {
          console.error(`[ML Client] failed to parse output JSON. Raw output: "${stdoutData}". Error: ${e.message}`);
          resolve({
            predictedClass: null,
            probability: 0.0,
            explanation: 'Failed to parse prediction response',
            modelVersion: 'unknown',
            confidenceThreshold: 0.65,
            error: 'JSON_PARSE_ERROR',
          });
        }
      });

      // Write features to stdin and end the stream
      child.stdin.write(JSON.stringify(features));
      child.stdin.end();

    } catch (err: any) {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        console.error(`[ML Client] failed to spawn python process. Error: ${err.message}`);
        resolve({
          predictedClass: null,
          probability: 0.0,
          explanation: 'ML Prediction Service unavailable',
          modelVersion: 'unknown',
          confidenceThreshold: 0.65,
          error: 'SPAWN_ERROR',
        });
      }
    }
  });
}
