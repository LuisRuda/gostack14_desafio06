import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Withdrawal amount greater than account balance');
    }

    const categoriesRepository = await getCustomRepository(
      CategoriesRepository,
    );

    const categoryAlreadyExist = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (categoryAlreadyExist) {
      const transaction = await transactionsRepository.create({
        title,
        value,
        type,
        category_id: categoryAlreadyExist.id,
      });

      await transactionsRepository.save(transaction);

      return transaction;
    }

    const newCategory = await categoriesRepository.create({
      title: category,
    });

    await categoriesRepository.save(newCategory);

    const transaction = await transactionsRepository.create({
      title,
      value,
      type,
      category_id: newCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
