import { ExtractedPrescription, PrescriptionExtractor, UploadedScan } from './prescription-extractor';
export declare class MockPrescriptionExtractor implements PrescriptionExtractor {
    extract(_scan: UploadedScan): Promise<ExtractedPrescription>;
}
