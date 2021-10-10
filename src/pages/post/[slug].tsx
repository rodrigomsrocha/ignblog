import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { AiOutlineCalendar, AiOutlineClockCircle } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';

import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const readTime =
    post.data.content.reduce(
      (acc, act) => {
        acc.total += act.heading.split(' ').length;
        acc.total += RichText.asText(act.body).trim().split(/\s+/).length;

        return acc;
      },
      {
        total: 0,
      }
    ).total / 200;

  const router = useRouter();
  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Head>
        <title>ignblog | {post.data.title}</title>
      </Head>
      <div
        className={styles.image}
        style={{ backgroundImage: `url(${post.data.banner.url})` }}
      />
      <section className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInformation}>
            <span>
              <AiOutlineCalendar size={20} color="#bbb" />
              {format(new Date(post.first_publication_date), 'dd MMM yyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser size={20} color="#bbb" />
              {post.data.author}
            </span>
            <span>
              <AiOutlineClockCircle size={20} color="#bbb" />
              {Math.ceil(readTime)} min
            </span>
          </div>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>
      </section>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async context => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
  );

  return {
    paths: posts.results.slice(0, 13).map(post => {
      return { params: { slug: post.uid } };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'post',
    String(context.params.slug),
    {}
  );

  return {
    props: { post: response },
  };
};
