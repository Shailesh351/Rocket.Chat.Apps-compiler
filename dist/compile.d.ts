import { ICompilerDescriptor, ICompilerResult } from './definition';
export declare function compile(compilerDesc: ICompilerDescriptor, sourceDir: string, outputFile: string): Promise<ICompilerResult>;
