import { ExtractedPrescription, PrescriptionExtractor, UploadedScan } from './prescription-extractor';
export declare class ClaudePrescriptionExtractor implements PrescriptionExtractor {
    private readonly logger;
    private client?;
    extract(scan: UploadedScan): Promise<ExtractedPrescription>;
    private getClient;
    private toHttpError;
}
