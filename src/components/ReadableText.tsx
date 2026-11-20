import React from 'react';
import { formatReadableContent, ReadableOptions } from '../utils/portalLogic';
import { RichText } from './RichText';

interface ReadableTextProps extends ReadableOptions {
  text: string;
  className?: string;
  boldClassName?: string;
  prefixClassName?: string;
  leadClassName?: string;
  bulletClassName?: string;
  paragraphSpacing?: string;
  listSpacing?: string;
}

export const ReadableText: React.FC<ReadableTextProps> = ({
  text,
  className = '',
  boldClassName,
  prefixClassName = 'font-semibold text-[#1E3A8A] dark:text-[#93C5FD]',
  leadClassName = 'font-medium text-[#1C1917] dark:text-[#F4F1EA]',
  bulletClassName = 'bg-[#B45309] dark:bg-[#F59E0B]',
  paragraphSpacing = 'space-y-2.5',
  listSpacing = 'space-y-1.5',
  listLengthThreshold,
  sentenceThreshold,
  maxChunkChars,
  preferListForLongText,
}) => {
  const formatted = formatReadableContent(text, {
    listLengthThreshold,
    sentenceThreshold,
    maxChunkChars,
    preferListForLongText,
  });

  if (formatted.kind === 'plain') {
    return (
      <p className={className}>
        <RichText text={formatted.text} boldClassName={boldClassName} />
      </p>
    );
  }

  if (formatted.kind === 'paragraphs') {
    return (
      <div className={`${paragraphSpacing} ${className}`}>
        {formatted.paragraphs.map((para, idx) => (
          <p key={idx}>
            <RichText text={para} boldClassName={boldClassName} />
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {formatted.lead && (
        <p className={leadClassName}>
          <RichText text={formatted.lead} boldClassName={boldClassName} />
        </p>
      )}
      <ul
        className={`${listSpacing} ${
          formatted.lead ? 'border-t border-[#EFEAE0] pt-2 dark:border-[#243047]' : ''
        }`}
      >
        {formatted.items.map((item, idx) => {
          if (item.prefix && item.body === '') {
            return (
              <li
                key={idx}
                className="pt-1 text-xs font-semibold tracking-wide text-[#57534E] dark:text-[#94A3B8]"
              >
                <RichText text={`${item.prefix}:`} boldClassName={boldClassName} />
              </li>
            );
          }

          return (
            <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rotate-45 ${bulletClassName}`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                {item.prefix ? (
                  <>
                    <span className={prefixClassName}>
                      <RichText text={item.prefix} boldClassName={prefixClassName} />
                    </span>
                    {item.prefix.endsWith(':') ? ' ' : ' — '}
                    <RichText text={item.body} boldClassName={boldClassName} />
                  </>
                ) : (
                  <RichText text={item.body} boldClassName={boldClassName} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
