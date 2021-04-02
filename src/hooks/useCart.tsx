import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  console.log(cart);
  const addProduct = async (productId: number) => {
    try {

      const updatedCart = [...cart];

      const checkCartProduct = updatedCart.find(product => product.id === productId);
      const currentAmountProductCart = (checkCartProduct) ? checkCartProduct.amount : 0;

      const stockProduct:Stock = await api.get(`stock/${productId}`).then((response) => response.data);
      
      if (currentAmountProductCart >= stockProduct.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const amountIncremented = currentAmountProductCart + 1;

      if(checkCartProduct) {
        checkCartProduct.amount = amountIncremented;
      }
      else {
        
        const product = await api.get(`products/${productId}`).then((response) => response.data);

        const newProduct = {
          ...product,
          amount: amountIncremented
        };

        updatedCart.push(newProduct);
      }
      
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter(product => product.id !== productId);

      if(cart.length === updatedCart.length) {
        throw new Error();
      }

      setCart(updatedCart);
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      if(amount <= 0) return;
      
      const stockProduct:Stock = await api.get(`stock/${productId}`).then(response => response.data);
      
      if(amount > stockProduct.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      const updatedAmountCartProduct = cart.map(product => product.id === productId ? {
        ...product,
        amount: amount
      } : product);
      
      setCart(updatedAmountCartProduct);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedAmountCartProduct));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
