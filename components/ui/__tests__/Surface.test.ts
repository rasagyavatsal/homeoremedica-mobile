import { splitSurfaceStyle } from '@/components/ui/Surface';

describe('splitSurfaceStyle', () => {
  it('keeps horizontal size constraints on the shadow wrapper', () => {
    const [outer, inner] = splitSurfaceStyle({
      width: '100%',
      maxWidth: 512,
      padding: 20,
    });

    expect(outer).toMatchObject({ width: '100%', maxWidth: 512 });
    expect(inner).toEqual({ padding: 20 });
  });
});
