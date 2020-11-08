import csv from 'csv-parse';
import path from 'path';
import fs from 'fs';

import AppError from '../errors/AppError';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  file: string;
}

interface CSVImport {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    const filePath = path.resolve(__dirname, uploadConfig.directory, file);

    const transactionsImported = await this.getParsedCSV(filePath);

    const createTransaction = new CreateTransactionService();

    const transactions: Transaction[] = [];

    for (const transaction of transactionsImported) {
      transactions.push(
        await createTransaction.execute({
          title: transaction.title,
          value: transaction.value,
          type: transaction.type,
          category: transaction.category.trim(),
        }),
      );
    }

    return transactions;
  }

  private getParsedCSV(filePath: string): Promise<CSVImport[]> {
    return new Promise<CSVImport[]>(resolve => {
      const transactionsImported: CSVImport[] = [];
      const reader = fs
        .createReadStream(filePath)
        .pipe(csv({ columns: true, from_line: 1, trim: true }))
        .on('data', data => {
          try {
            reader.pause();
            transactionsImported.push(data);
          } finally {
            reader.resume();
          }
        })
        .on('end', () => {
          resolve(transactionsImported);
        })
        .on('error', err => new AppError(err.message));
    });
  }
}

export default ImportTransactionsService;
