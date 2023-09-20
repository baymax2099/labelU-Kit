import { useContext, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { AttributeTree, CollapseWrapper, AttributeTreeWrapper, EllipsisText } from '@label-u/components-react';
import type {
  EnumerableAttribute,
  GlobalAnnotationType,
  TagAnnotationEntity,
  TextAnnotationEntity,
  TextAttribute,
  VideoAnnotationData,
} from '@label-u/interface';
import { uid } from '@label-u/video-react';

import { ReactComponent as DeleteIcon } from '@/assets/icons/delete.svg';

import type { VideoAnnotationInEditor } from '../context';
import EditorContext from '../context';
import AsideAttributeItem, { AttributeAction, Header } from './AsideAttributeItem';

const Wrapper = styled.div<{ collapsed: boolean }>`
  grid-area: attribute;
  height: var(--height);
  overflow: auto;
  display: flex;
  flex-direction: column;

  ${({ collapsed }) => (collapsed ? 'width: 0;' : 'width: 280px;')}
`;

const AttributeHeaderItem = styled.div<{ active: boolean }>`
  height: 100%;
  display: flex;
  padding: 0 0.5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 2px solid transparent;

  ${({ active }) =>
    active &&
    css`
      color: var(--color-primary);
      border-bottom: 2px solid var(--color-primary);
    `}

  &:hover {
    color: var(--color-primary);
  }

  .attribute__status {
    font-size: 12px;
    color: #999;
  }
`;

const TabHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  width: 100%;
  align-items: center;
  justify-content: space-around;
  height: 68px;
  border-bottom: #e5e5e5 1px solid;
`;

const AsideWrapper = styled.div``;

const Content = styled.div<{ activeKey: HeaderType }>`
  padding: 1rem 0;
  flex: 1 auto;
  min-height: 0;
  overflow: auto;

  & > ${AttributeTreeWrapper} {
    display: ${({ activeKey }) => (activeKey === 'global' ? 'block' : 'none')};
  }

  & > ${CollapseWrapper as any} {
    display: ${({ activeKey }) => (activeKey === 'label' ? 'block' : 'none')};
  }
`;

const Footer = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  border-top: #e5e5e5 1px solid;
  cursor: pointer;

  &:hover {
    color: red;
  }
`;

type HeaderType = 'global' | 'label';

export default function Attribute() {
  const {
    videoWrapperRef,
    config,
    currentSample,
    onAnnotationsChange,
    annotationsMapping,
    onAnnotationsRemove,
    videoAnnotations,
    selectedAnnotation,
    attributeMapping,
  } = useContext(EditorContext);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [height, setHeight] = useState<number>(0);

  const { globalAnnotations, videoAnnotationsGroup, defaultActiveKeys } = useMemo(() => {
    const _globalAnnotations: (TextAnnotationEntity | TagAnnotationEntity)[] = [];
    currentSample?.annotations.forEach((item) => {
      if (['tag', 'text'].includes(item.type)) {
        _globalAnnotations.push(item as TextAnnotationEntity | TagAnnotationEntity);
      }
    });

    const videoAnnotationsGroupByLabel = new Map<string, VideoAnnotationData[]>();

    for (const item of videoAnnotations) {
      if (!videoAnnotationsGroupByLabel.has(item.label)) {
        videoAnnotationsGroupByLabel.set(item.label, []);
      }

      videoAnnotationsGroupByLabel?.get(item.label)?.push(item);
    }

    return {
      globalAnnotations: _globalAnnotations,
      videoAnnotationsGroup: videoAnnotationsGroupByLabel,
      defaultActiveKeys: Array.from(videoAnnotationsGroupByLabel.keys()),
    };
  }, [currentSample?.annotations, videoAnnotations]);

  const globals = useMemo(() => {
    const _globals: (TextAttribute | EnumerableAttribute)[] = [];

    if (!config) {
      return _globals;
    }

    if (config.tag) {
      _globals.push(...config.tag);
    }

    if (config.text) {
      _globals.push(...config.text);
    }

    return _globals;
  }, [config]);

  const titles = useMemo(() => {
    const _titles = [];
    // 将文本描述和标签分类合并成全局配置
    if (config?.tag || config?.text) {
      let isCompleted = false;

      if (config.text) {
        const textAnnotations = globalAnnotations.filter((item) => item.type === 'text') as TextAnnotationEntity[];
        const textAnnotationMapping = textAnnotations.reduce((acc, item) => {
          const key = Object.keys(item.value)[0];
          acc[key] = item;
          return acc;
        }, {} as Record<string, TextAnnotationEntity>);

        // 如果所有的文本描述都是必填的，那么只要有一个不存在，那么就是未完成
        isCompleted = config.text
          .filter((item) => item.required)
          .every((item) => textAnnotationMapping[item.value]?.value?.[item.value]);
      }

      _titles.push({
        title: '全局',
        key: 'global' as const,
        subtitle: isCompleted ? '已完成' : '未完成',
      });
    }

    if (config?.segment || config?.frame) {
      _titles.push({
        title: '标记',
        key: 'label' as const,
        subtitle: `${videoAnnotations.length}条`,
      });
    }

    return _titles;
  }, [config?.frame, config?.segment, config?.tag, config?.text, globalAnnotations, videoAnnotations.length]);
  const [activeKey, setActiveKey] = useState<HeaderType>(globals.length === 0 ? 'label' : 'global');

  useEffect(() => {
    setTimeout(() => {
      setHeight(videoWrapperRef.current?.clientHeight || 0);
    });
  });

  useEffect(() => {
    const handleCollapse = () => {
      setCollapsed((prev) => !prev);
    };

    document.addEventListener('attribute-collapse', handleCollapse as EventListener);

    return () => {
      document.removeEventListener('attribute-collapse', handleCollapse as EventListener);
    };
  }, []);

  const handleOnChange = (_changedValues: any, values: any[], type: GlobalAnnotationType) => {
    const newAnnotations = [];
    const existAnnotations: VideoAnnotationInEditor[] = [];

    for (const item of values) {
      if (item.id && item.id in annotationsMapping) {
        existAnnotations.push(item);
      } else {
        newAnnotations.push({
          id: item.id || uid(),
          type,
          value: item.value,
        });
      }
    }

    const annotations =
      currentSample?.annotations.map((item) => {
        const existIndex = existAnnotations.findIndex((innerItem) => innerItem.id === item.id);
        if (existIndex >= 0) {
          return existAnnotations[existIndex];
        }

        return item;
      }) ?? [];
    onAnnotationsChange([...annotations, ...newAnnotations]);
  };

  const handleClear = () => {
    if (!currentSample) {
      return;
    }

    if (activeKey === 'global') {
      onAnnotationsRemove(globalAnnotations);
    } else {
      onAnnotationsRemove(videoAnnotations);
    }
  };

  const collapseItems = useMemo(
    () =>
      Array.from(videoAnnotationsGroup).map(([label, annotations]) => {
        const found = attributeMapping[annotations[0].type]?.[label];
        const labelText = found ? found?.key ?? '无标签' : '无标签';

        return {
          label: (
            <Header>
              <EllipsisText maxWidth={180} title={labelText}>
                <div>{labelText}</div>
              </EllipsisText>

              <AttributeAction annotations={annotations} showEdit={false} />
            </Header>
          ),
          key: label,
          children: (
            <AsideWrapper>
              {annotations.map((item) => (
                <AsideAttributeItem
                  key={item.id}
                  active={item.id === selectedAnnotation?.id}
                  order={item.order}
                  annotation={item}
                  labelText={attributeMapping[item.type]?.[label]?.key ?? '无标签'}
                  color={attributeMapping[item.type]?.[label]?.color ?? '#999'}
                />
              ))}
            </AsideWrapper>
          ),
        };
      }),
    [attributeMapping, selectedAnnotation?.id, videoAnnotationsGroup],
  );

  if (!height) {
    return null;
  }

  return (
    // @ts-ignore
    <Wrapper collapsed={collapsed} style={{ '--height': `${height}px` }}>
      <TabHeader className="attribute-header">
        {titles.map((item) => {
          return (
            <AttributeHeaderItem
              onClick={() => setActiveKey(item.key)}
              active={item.key === activeKey}
              key={item.key}
              className="attribute-header__item"
            >
              <div>{item.title}</div>
              <div className="attribute__status">{item.subtitle}</div>
            </AttributeHeaderItem>
          );
        })}
      </TabHeader>
      <Content activeKey={activeKey}>
        <CollapseWrapper defaultActiveKey={defaultActiveKeys} items={collapseItems} />
        <AttributeTree data={globalAnnotations} config={globals} onChange={handleOnChange} />
      </Content>
      <Footer onClick={handleClear}>
        <DeleteIcon />
        &nbsp; 清空
      </Footer>
    </Wrapper>
  );
}
