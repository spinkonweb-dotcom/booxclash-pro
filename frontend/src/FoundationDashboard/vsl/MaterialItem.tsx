import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';

interface DraggableItem {
  id: string;
  name: string;
  image: string;
  type: string;
}

interface MaterialItemProps {
  item: DraggableItem;
  type: string;
}

const MaterialItem: React.FC<MaterialItemProps> = ({ item, type }) => {
  const [{ isDragging }, drag] = useDrag<DraggableItem, void, { isDragging: boolean }>({
    type,
    item: { ...item, type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // This is the key fix — manually create a ref and pass it to both `drag()` and the JSX
  const ref = useRef<HTMLDivElement>(null);
  drag(ref);

  return (
    <div
      ref={ref}
      className={`p-2 m-2 border rounded bg-white shadow cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <img src={item.image} alt={item.name} className="h-16 w-16 mx-auto" />
      <p className="text-center text-sm mt-2">{item.name}</p>
    </div>
  );
};

export default MaterialItem;
