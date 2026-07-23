import { api } from './client';

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  categoryId: string | null;
  category: Category | null;
}

export interface ProductInput {
  name: string;
  price: number;
  categoryId?: string | null;
  active?: boolean;
}

export async function listProducts() {
  const { data } = await api.get<Product[]>('/products');
  return data;
}

export async function createProduct(input: ProductInput) {
  const { data } = await api.post<Product>('/products', input);
  return data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const { data } = await api.patch<Product>(`/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}

export async function listCategories() {
  const { data } = await api.get<Category[]>('/categories');
  return data;
}
