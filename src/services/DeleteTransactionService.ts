import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<boolean> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionExist = await transactionsRepository.findOne({
      where: {
        id,
      },
    });

    if (!transactionExist) {
      throw new AppError('Transaction not found.');
    }

    await transactionsRepository.remove(transactionExist);

    return true;
  }
}

export default DeleteTransactionService;
