import { existsSync, unlinkSync } from "fs";

export function deleteImage(filePath: string) {
    if (existsSync(filePath)) {
        unlinkSync(filePath);
    }
}