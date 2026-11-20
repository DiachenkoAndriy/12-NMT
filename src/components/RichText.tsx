import React from 'react';
import { parseBoldSegments } from '../utils/portalLogic';

interface RichTextProps {
  text: string;
  boldClassName?: string;
}

export const RichText: React.FC<RichTextProps> = ({
  text,
  boldClassName = 'font-semibold text-[#1C1917] dark:text-[#F4F1EA]',
}) => {
  const segments = parseBoldSegments(text);
  return (
    <>
      {segments.map((seg, idx) =>
        seg.bold ? (
          <strong key={idx} className={boldClassName}>
            {seg.text}
          </strong>
        ) : (
          <React.Fragment key={idx}>{seg.text}</React.Fragment>
        ),
      )}
    </>
  );
};
