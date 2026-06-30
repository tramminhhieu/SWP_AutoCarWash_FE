interface LoadingProps {
  rows?: number;
}

// Skeleton hiển thị khi đang chờ dữ liệu list (dùng cho 3 cột Province/Commune/Station)
const Loading = ({ rows = 4 }: LoadingProps) => {
  return (
    <div className="flex flex-col gap-2 p-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-[52px] rounded-lg bg-surface-container-high animate-pulse"
        />
      ))}
    </div>
  );
};

export default Loading;
