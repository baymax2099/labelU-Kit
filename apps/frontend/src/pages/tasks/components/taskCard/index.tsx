import React, { useState } from 'react';
import { Modal, Progress, Tooltip } from 'antd';
import { useNavigate } from 'react-router';
import Icon, { ExclamationOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import formatter from '@label-u/formatter';

import { modal } from '@/StaticAnt';
import type { Dispatch, RootState } from '@/store';
import { ReactComponent as DeleteIcon } from '@/assets/svg/delete.svg';
import { ReactComponent as OutputIcon } from '@/assets/svg/outputData.svg';
import { deleteTask } from '@/services/task';
import FlexItem from '@/components/FlexItem';
import Status from '@/components/Status';
import IconText from '@/components/IconText';
import ExportPortal from '@/components/ExportPortal';
import { MediaTypeText } from '@/constants/mediaType';
import type { MediaType } from '@/services/types';

import currentStyles from './index.module.scss';

const TaskCard = (props: any) => {
  const [isShowDeleteModal, setIsShowDeleteModal] = useState(false);
  const { cardInfo } = props;
  const dispatch = useDispatch<Dispatch>();
  const [searchParams] = useSearchParams({
    page: '1',
  });
  const { stats, id, status } = cardInfo;
  const unDoneSample = stats.new;
  const doneSample = stats.done + stats.skipped;
  const total = unDoneSample + doneSample;
  const navigate = useNavigate();
  const turnToAnnotation = (e: any) => {
    if (!e.currentTarget.contains(e.target)) {
      return;
    }

    e.stopPropagation();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    navigate('/tasks/' + id);
  };
  const userInfo = useSelector((state: RootState) => state.user);

  const handleDeleteTask = (e: React.MouseEvent) => {
    e.stopPropagation();

    modal.confirm({
      title: '删除任务',
      content: '确定删除该任务吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        await dispatch.task.deleteTask(id);
        await dispatch.task.fetchTasks({
          page: Number(searchParams.get('page')) - 1,
        });
      },
    });
  };

  // TODO: 以下代码需要优化 =============================
  const deleteSingleTaskOk = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowDeleteModal(false);
    deleteTask(id).then(() => {
      navigate('/tasks');
    });
  };
  const deleteSingleTaskCancel = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
    setIsShowDeleteModal(false);
  };
  const stopPropagation = (e: any) => {
    e.stopPropagation();
    e.nativeEvent.stopPropagation();
    e.preventDefault();
  };

  return (
    <FlexItem className={currentStyles.cardWrapper} onClick={turnToAnnotation}>
      <div className={currentStyles.cardInner}>
        <div className={currentStyles.item}>
          <div className={currentStyles.itemLeft}>
            <div className={currentStyles.itemTaskName}>{cardInfo.name}</div>
            {cardInfo.status !== 'DRAFT' && cardInfo.status !== 'IMPORTED' && (
              <div className={currentStyles.mediaType}>
                <div style={{ color: 'var(--color-primary)' }}>{MediaTypeText[cardInfo.media_type as MediaType]}</div>
              </div>
            )}
            {(cardInfo.status === 'DRAFT' || cardInfo.status === 'IMPORTED') && (
              <div className={currentStyles.draft}>
                <div style={{ color: '#FF8800' }}>草稿</div>
              </div>
            )}
          </div>
          <div className={currentStyles.actions}>
            <ExportPortal taskId={cardInfo.id} mediaType={cardInfo.media_type}>
              <div className={currentStyles.upload}>
                <Tooltip placement={'top'} title={'数据导出'}>
                  <Icon className={currentStyles.actionIcon} component={OutputIcon} />
                </Tooltip>
              </div>
            </ExportPortal>
            {userInfo.username === cardInfo.created_by.username && (
              <div onClick={handleDeleteTask} className={currentStyles.delete}>
                <Tooltip title={'删除文件'} placement={'top'}>
                  <Icon className={currentStyles.actionIcon} component={DeleteIcon} />
                </Tooltip>
              </div>
            )}
          </div>
        </div>
        <div className={currentStyles.item} style={{ marginTop: '8px' }}>
          {cardInfo.created_by?.username}
        </div>
        <div className={currentStyles.item} style={{ marginTop: '8px' }}>
          {formatter.format('dateTime', cardInfo.created_at, { style: 'YYYY-MM-DD HH:mm' })}
        </div>
        {doneSample === total && status !== 'DRAFT' && status !== 'IMPORTED' && (
          <div className={currentStyles.item41}>
            <div className={currentStyles.item41Left}>
              {total}/{total}
            </div>
            <div className={currentStyles.item41Right}>
              <Status type="success">已完成</Status>
            </div>
          </div>
        )}
        {doneSample !== total && status !== 'DRAFT' && status !== 'IMPORTED' && (
          <div className={currentStyles.item42}>
            <div className={currentStyles.item42Left}>
              <Progress percent={Math.trunc((doneSample * 100) / total)} showInfo={false} />
            </div>
            <div className={currentStyles.item41Left}>
              {doneSample}/{total}
            </div>
          </div>
        )}
        {isShowDeleteModal && (
          <div onClick={stopPropagation}>
            <Modal open={isShowDeleteModal} onOk={deleteSingleTaskOk} onCancel={deleteSingleTaskCancel}>
              <IconText
                icon={
                  <div className={currentStyles.tipWarnIcon}>
                    <ExclamationOutlined />
                  </div>
                }
              >
                您确认要删除该任务吗？
              </IconText>
            </Modal>
          </div>
        )}
      </div>
    </FlexItem>
  );
};
export default TaskCard;
